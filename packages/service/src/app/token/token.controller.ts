import { Controller, Get, Logger, Query, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';
import { entries, forEach, values } from 'lodash';
import { TokenService } from './token.service';
import { FyersResponseParamsDto } from './dtos/fyers-response-param.dto';
import { IndexSymbolObjType } from '../types/index-symbol-obj.type';
import { TapeService } from '../tape/tape.service';
import { StoreService } from '../common/store.service';
import { CommonService } from '../common/common.service';

@Controller('token')
export class TokenController {
  private logger = new Logger(TokenController.name);

  constructor(
    private tokenService: TokenService,
    private readonly configService: ConfigService,
    private storeService: StoreService,
    private commonService: CommonService,
    private tapeService: TapeService,
  ) {}

  /**
   * Get token from cache
   * @returns token
   */
  @Get('')
  async getToken() {
    this.logger.verbose('Get access token');
    const accessToken = this.tokenService.accessTokenValue;
    if (!accessToken) {
      new UnauthorizedException('Access token expired or not found');
    }
    this.logger.verbose('Found token in cache');
    return {
      accessToken,
    };
  }

  /**
   * Generate token from fyers
   * @returns a redirect to fyers auth page
   */
  @Get('generate')
  generateToken(@Res() reply: FastifyReply) {
    this.logger.verbose('Callback from fyers');
    const clientId = this.configService.get('broker.clientId');
    const redirectUri = this.configService.get('broker.redirectUri');
    const fyersAuthHost = this.configService.get('broker.authHost');
    const authUrl = new URL(fyersAuthHost);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', 'test_env');
    reply.redirect(301, authUrl.toString());
  }

  /**
   * Callback from fyers with access token
   * @returns a redirect to web app
   */
  @Get('callback')
  async callback(@Query() queryParams: FyersResponseParamsDto, @Res() reply: FastifyReply): Promise<void> {
    this.logger.verbose('Callback from fyers');
    await this.tokenService.saveFyersCred(queryParams);
    this.tokenService.initFyersLib();

    this.logger.verbose('Listen to default symbols');
    const webAppRedirect = this.configService.get('webApp');
    const optionChains = entries(this.tapeService.optionChains);
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    forEach(optionChains, ([indexSymbol, indexOcs]) => {
      const atmStrike = this.commonService.getATMStrikeNumfromCur(
        indexOcs.underlyingValue,
        defaultSymbols[indexSymbol].strikeDiff,
      );
      const nextExpiry = this.commonService.getStandardDateFmt(new Date(indexOcs.expiryDates[0]));
      const nextExpiryOptionChain = values(indexOcs.ocs[nextExpiry]);
      const combinedOptionList =  values(nextExpiryOptionChain[0]);
      forEach(combinedOptionList, (optionData) => {
        const { strikeExtreme } = defaultSymbols[indexSymbol];
        const peExtreme = atmStrike - strikeExtreme;
        const ceExtreme = atmStrike + strikeExtreme;
        if (peExtreme > optionData.strikePrice || ceExtreme < optionData.strikePrice) {
          return null;
        }

        const strikeSymbol = this.commonService.memoConvertIdtoStrikeSymbol(optionData.identifier);
        this.tapeService.setTapeData(strikeSymbol, optionData);
      });
    });
    await this.tapeService.triggerListen();
    reply.redirect(301, webAppRedirect);
  }
}
