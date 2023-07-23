import { Controller, Get, Inject, Logger, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';
import { flattenDeep, set, values } from 'lodash';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TokenService } from './token.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FyersResponseParamsDto } from './dtos/fyers-response-param.dto';
import { CommonService } from '../common/common.service';

@Controller('token')
export class TokenController {
  private logger = new Logger(TokenController.name);

  constructor(
    private tokenService: TokenService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private eventEmitter: EventEmitter2,
    private commonService: CommonService,
  ) {}

  /**
   * Get token from cache
   * @returns token
   */
  @Get('')
  async getToken() {
    this.logger.verbose('Get access token');
    const accessToken = this.tokenService.accessTokenValue;
    if (accessToken) {
      this.logger.verbose('Found token in cache');
      return {
        accessToken,
      };
    }
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
    const defaultSymbols = this.configService.get('defaultSymbols');
    let liveSymbolData = {};
    const watchList = await Promise.all(
      values(defaultSymbols).map(async ({ strikeDiff, symbol }) => {
        const current = await this.commonService.fetchSymbolData(symbol);
        set(liveSymbolData, `${symbol}.current`, current);
        await this.cacheManager.set('liveSymbolData', liveSymbolData);
        const atm = this.commonService.getATMStrikeNumfromCur(current, strikeDiff);
        return this.commonService.prepareSymbolList(symbol, atm, '23AUG');
      }),
    );
    const flattenedWatchList = flattenDeep(watchList);
    await this.cacheManager.set('watchList', flattenedWatchList, 0);
    const webAppRedirect = this.configService.get('webApp');
    this.eventEmitter.emit('watchListUpdate', flattenedWatchList);
    reply.redirect(301, webAppRedirect);
  }
}
