import {
  ConfigurationService,
  configurationService,
} from "../configuration/configuration.service";
import { entitiesService, EntitiesService } from "./entities.service";
import { IEntityField } from "./types";

export class EntitiesController {
  constructor(
    private entitiesService: EntitiesService,
    private configurationService: ConfigurationService
  ) {}
  async getMenuEntities() {
    const entities = this.entitiesService.getAllEntities();
    const hiddenEntities = (await this.configurationService.show(
      "entities_to_hide_from_menu"
    )) as string[];
    return entities.filter(({ value }) => !hiddenEntities.includes(value));
  }

  listAllEntities() {
    return this.entitiesService.getAllEntities();
  }

  getEntityFields(entity: string): IEntityField[] {
    return this.entitiesService.getEntityFields(entity);
  }
}

export const entitiesController = new EntitiesController(
  entitiesService,
  configurationService
);
