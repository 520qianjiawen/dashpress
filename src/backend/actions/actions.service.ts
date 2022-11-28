import {
  credentialsService,
  CredentialsService,
} from "backend/integrations-configurations";
import {
  createConfigDomainPersistenceService,
  AbstractConfigDataPersistenceService,
} from "backend/lib/config-persistence";
import { validateSchemaRequestBody } from "backend/lib/errors/validate-schema-request-input";
import { IApplicationService } from "backend/types";
import { noop } from "lodash";
import { nanoid } from "nanoid";
import {
  HTTP_ACTION_KEY,
  IIntegrationsList,
  IActionInstance,
  IActivatedAction,
  IIntegrationImplementationList,
} from "shared/types/actions";
import { ACTION_INTEGRATIONS } from ".";

export class ActionsService implements IApplicationService {
  constructor(
    private readonly _activatedActionsPersistenceService: AbstractConfigDataPersistenceService<IActivatedAction>,
    private readonly _actionInstancesPersistenceService: AbstractConfigDataPersistenceService<IActionInstance>,
    private readonly _credentialsService: CredentialsService
  ) {}

  async bootstrap() {
    await this._activatedActionsPersistenceService.setup();
    await this._actionInstancesPersistenceService.setup();
  }

  async runAction(entity: string, formAction: string, id: unknown) {
    noop(id);
    const instances = await this.listEntityActionInstances(entity);
    const actionsToRun = instances.filter(
      (action) => action.formAction === formAction
    );

    for (const action of actionsToRun) {
      const { configuration, implementationKey, activatedActionId } = action;
      // run triggerLogic triggerLogic
      const activatedAction =
        await this._activatedActionsPersistenceService.getItemOrFail(
          activatedActionId
        );
      if (!activatedAction) {
        return;
      }

      const actionConfiguration = await this.showActionConfig(
        activatedActionId
      );

      const connection =
        ACTION_INTEGRATIONS[activatedAction.integrationKey].connect(
          actionConfiguration
        );
      // TODO compile the configuration here
      await ACTION_INTEGRATIONS[
        activatedAction.integrationKey
      ].performsImplementation[implementationKey].do(connection, configuration);
    }
  }

  async instantiateAction(action: Omit<IActionInstance, "instanceId">) {
    const instanceId = nanoid();
    const activatedActions = await this.listActivatedActions();

    const integrationKey = activatedActions.find(
      ({ activationId }) => action.activatedActionId === activationId
    )?.integrationKey;

    await this._actionInstancesPersistenceService.upsertItem(instanceId, {
      ...action,
      integrationKey,
      instanceId,
    });
  }

  async updateActionInstance(instanceId: string, instance: IActionInstance) {
    await this._actionInstancesPersistenceService.upsertItem(
      instanceId,
      instance
    );
  }

  async deleteActionInstance(instanceId: string) {
    await this._actionInstancesPersistenceService.removeItem(instanceId);
  }

  async listEntityActionInstances(entity$1: string) {
    return (await this._actionInstancesPersistenceService.getAllItems()).filter(
      ({ entity }) => entity === entity$1
    );
  }

  async listIntegrationActions(integrationKey$1: string) {
    return (await this._actionInstancesPersistenceService.getAllItems()).filter(
      ({ integrationKey }) => integrationKey === integrationKey$1
    );
  }

  //

  listIntegrations(): IIntegrationsList[] {
    return Object.entries(ACTION_INTEGRATIONS).map(
      ([key, { title, description, configurationSchema }]) => ({
        description,
        title,
        key,
        configurationSchema,
      })
    );
  }

  listIntegrationImplementations(
    integrationKey: string
  ): IIntegrationImplementationList[] {
    return Object.entries(
      ACTION_INTEGRATIONS[integrationKey].performsImplementation
    ).map(([key, { configurationSchema, label }]) => ({
      label,
      key,
      configurationSchema,
    }));
  }

  async listActivatedActions(): Promise<IActivatedAction[]> {
    const activatedActions =
      await this._activatedActionsPersistenceService.getAllItems();
    return [
      ...activatedActions,
      {
        activationId: "DEFAULT",
        credentialsGroupKey: "DEFAULT",
        integrationKey: HTTP_ACTION_KEY,
      },
    ];
  }

  async activateAction(
    integrationKey: string,
    configuration: Record<string, string>
  ): Promise<void> {
    const activationId = nanoid();
    const credentialsGroupKey = integrationKey.toUpperCase();
    await this._activatedActionsPersistenceService.upsertItem(activationId, {
      activationId,
      integrationKey,
      credentialsGroupKey,
    });

    validateSchemaRequestBody(
      ACTION_INTEGRATIONS[integrationKey].configurationSchema,
      configuration
    );

    await this._credentialsService.upsertGroup(
      {
        key: credentialsGroupKey,
        fields: Object.keys(
          ACTION_INTEGRATIONS[integrationKey].configurationSchema
        ),
      },
      configuration
    );
  }

  async showActionConfig(
    activationId: string
  ): Promise<Record<string, unknown>> {
    if (activationId === "DEFAULT") {
      return {};
    }
    const { credentialsGroupKey, integrationKey } =
      await this._activatedActionsPersistenceService.getItemOrFail(
        activationId
      );

    if (
      Object.keys(ACTION_INTEGRATIONS[integrationKey].configurationSchema)
        .length === 0
    ) {
      return {};
    }

    return await this._credentialsService.useGroupValue({
      key: credentialsGroupKey,
      fields: Object.keys(
        ACTION_INTEGRATIONS[integrationKey].configurationSchema
      ),
    });
  }

  async updateActionConfig(
    activationId: string,
    configuration: Record<string, string>
  ): Promise<void> {
    const { integrationKey, credentialsGroupKey } =
      await this._activatedActionsPersistenceService.getItemOrFail(
        activationId
      );

    validateSchemaRequestBody(
      ACTION_INTEGRATIONS[integrationKey].configurationSchema,
      configuration
    );

    await this._credentialsService.upsertGroup(
      {
        key: credentialsGroupKey,
        fields: Object.keys(
          ACTION_INTEGRATIONS[integrationKey].configurationSchema
        ),
      },
      configuration
    );
  }

  async deactivateAction(activationId: string): Promise<void> {
    const action = await this._activatedActionsPersistenceService.getItemOrFail(
      activationId
    );

    this._credentialsService.deleteGroup({
      key: action.credentialsGroupKey,
      fields: Object.keys(
        ACTION_INTEGRATIONS[action.integrationKey].configurationSchema
      ),
    });

    await this._activatedActionsPersistenceService.removeItem(activationId);

    const instances =
      await this._actionInstancesPersistenceService.getAllItems();

    for (const instance of instances) {
      if (instance.activatedActionId === activationId) {
        await this._actionInstancesPersistenceService.removeItem(
          instance.instanceId
        );
      }
    }
  }
}

const activatedActionsPersistenceService =
  createConfigDomainPersistenceService<IActivatedAction>("activated_actions");

const actionInstancesPersistenceService =
  createConfigDomainPersistenceService<IActionInstance>("action_instances");

export const actionsService = new ActionsService(
  activatedActionsPersistenceService,
  actionInstancesPersistenceService,
  credentialsService
);
