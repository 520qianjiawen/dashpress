import { AppLayout } from "../../_layouts/app";
import {
  ErrorAlert,
  SectionBox,
  SectionCenter,
  Spacer,
  Text,
} from "@gothicgeeks/design-system";
import { TitleLang } from "@gothicgeeks/shared";
import { NAVIGATION_LINKS } from "../../lib/routing/links";
import {
  useEntityDiction,
  useEntityFieldLabels,
  useEntityId,
  useEntitySlug,
  useSelectedEntityColumns,
} from "../../hooks/entity/entity.config";
import { useEntityDataDetails } from "../../hooks/data/data.store";
import {
  EntityActionTypes,
  useEntityActionMenuItems,
} from "./Configure/constants";
import { useEntityScalarFields } from "../../hooks/entity/entity.store";

export function EntityDetails() {
  const entity = useEntitySlug();
  const entityDiction = useEntityDiction();
  const id = useEntityId();
  const dataDetails = useEntityDataDetails(entity, id);
  const actionItems = useEntityActionMenuItems([
    EntityActionTypes.CRUD,
    EntityActionTypes.Fields,
  ]);
  const entityScalarFields = useEntityScalarFields(entity);
  const hiddenDetailsColumns = useSelectedEntityColumns(
    "hidden_entity_details_columns"
  );
  const getEntityFieldLabels = useEntityFieldLabels();

  return (
    <AppLayout
      titleNeedsContext={true}
      breadcrumbs={[
        {
          label: entityDiction.plural,
          value: NAVIGATION_LINKS.ENTITY.TABLE(entity),
        },
        {
          label: "Details",
          value: NAVIGATION_LINKS.ENTITY.DETAILS(entity, id),
        },
      ]}
      actionItems={actionItems}
    >
      <SectionCenter>
        {dataDetails.error ? (
          <>
            <Spacer />
            <ErrorAlert message={dataDetails.error} />
            <Spacer />
          </>
        ) : null}
        <SectionBox
          title={TitleLang.details(entityDiction.singular)}
          backLink={{
            link: NAVIGATION_LINKS.ENTITY.TABLE(entity),
            label: entityDiction.plural,
          }}
        >
          {dataDetails.isLoading ||
          entityScalarFields.isLoading ||
          hiddenDetailsColumns.isLoading ? (
            <>TODO Loading Data...</>
          ) : (
            <>
              {(entityScalarFields.data || [])
                .filter(
                  ({ name }) =>
                    !(hiddenDetailsColumns.data || []).includes(name)
                )
                .map(({ name }) => (
                  <>
                    <Text size="5" weight="bold">{getEntityFieldLabels(name)}</Text>
                    <Text>{dataDetails.data[name]}</Text>
                    <Spacer />
                  </>
                ))}
            </>
          )}
        </SectionBox>
      </SectionCenter>
    </AppLayout>
  );
}
