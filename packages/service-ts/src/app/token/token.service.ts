import { Injectable } from '@nestjs/common';
import fyersApiV2 from 'fyers-api-v2';
import { ConfigService } from '@nestjs/config';
import { FyersResponseParamsDto } from './dtos/fyers-response-param.dto';
import { ExtractedFyersCred } from './types';

@Injectable()
export class TokenService {
  private accessToken: string;
  private appId: string;
  private redirectUri: string;

  constructor(private readonly configService: ConfigService) {}

  get accessTokenValue(): string {
    if (!this.accessToken) {
      throw new Error('Token unavailable');
    }
    return this.accessToken;
  }

  async saveFyersCred(queryParams: FyersResponseParamsDto): Promise<void> {
    const { clientId, appSecret, redirectUri } = this.configService.get('broker');
    const fyersCred = (await fyersApiV2.generate_access_token({
      client_id: clientId,
      secret_key: appSecret,
      ...queryParams,
    })) as ExtractedFyersCred;
    this.appId = clientId;
    this.redirectUri = redirectUri;
    this.accessToken = fyersCred.access_token;
  }

  initFyersLib(): void {
    fyersApiV2.setAppId(this.appId);
    fyersApiV2.setRedirectUrl(this.redirectUri);
    fyersApiV2.setAccessToken(this.accessToken);
  }
}
