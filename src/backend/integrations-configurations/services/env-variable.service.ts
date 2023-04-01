import {
  AbstractConfigDataPersistenceService,
  createConfigDomainPersistenceService,
} from "backend/lib/config-persistence";
import {
  encryptionApiService,
  EncryptionApiService,
} from "backend/lib/encryption/encryption.service";
import { IntegrationsConfigurationApiService } from "./_base";

class PlainConfigurationService extends IntegrationsConfigurationApiService {
  constructor(
    _credentialsPersistenceService: AbstractConfigDataPersistenceService<string>,
    _encryptionService: EncryptionApiService
  ) {
    super(_credentialsPersistenceService, _encryptionService);
  }
}

export const environmentVariablesApiService = new PlainConfigurationService(
  createConfigDomainPersistenceService<string>("environment-variables"),
  encryptionApiService
);

export const appConstantsApiService = new PlainConfigurationService(
  createConfigDomainPersistenceService<string>("constants"),
  encryptionApiService
);
