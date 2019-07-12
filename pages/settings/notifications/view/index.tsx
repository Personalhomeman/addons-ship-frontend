import { Base, Text, Divider, Buttons, Button, Flex } from '@bitrise/bitkit';

import AddNew, { Props as AddNewProps } from './add-new';
import List, { Props as ListProps } from './contact-list';

export interface Props extends AddNewProps, ListProps {
  onSave?: () => void;
}

export default ({ onAddEmail, appContacts, onNotificationPreferenceChanged, onSave }: Props) => (
  <Base paddingVertical="x8">
    <Text size="x5" weight="bold" paddingVertical="x3">
      Email Notifications
    </Text>
    <Divider color="gray-2" />
    <Base paddingVertical="x6">
      <AddNew onAddEmail={onAddEmail} />
    </Base>
    <Base margin="x4">
      <List appContacts={appContacts} onNotificationPreferenceChanged={onNotificationPreferenceChanged} />
    </Base>
    <Flex margin="x12" direction="horizontal" alignChildrenHorizontal="end">
      <Buttons>
        <Button level="secondary">Cancel</Button>
        <Button disabled={!onSave} level="primary" onClick={onSave}>
          Save
        </Button>
      </Buttons>
    </Flex>
  </Base>
);
