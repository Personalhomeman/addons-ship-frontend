import { Fragment } from 'react';
import { InputLabel, InputContainer, InputContent, Input, Button, ProgressSpinner, Flex } from '@bitrise/bitkit';
import { mediaQuery } from '@/utils/media';
import { emailMaxLength } from '@/config';

import css from './style.scss';

export type Props = {
  email: string;
  onEmailChange: (email: string) => void;
  onAddEmail: (email: string) => void;
  isAddingEmail: boolean;
};

export default ({ email, onEmailChange, onAddEmail, isAddingEmail }: Props) => {
  const [isTablet] = mediaQuery('30rem');

  const addEmailButton = () => (
    <Button level="secondary" disabled={!email || isAddingEmail}>
      {isAddingEmail ? (
        <Fragment>
          <ProgressSpinner /> &nbsp; Adding...
        </Fragment>
      ) : (
        'Add'
      )}
    </Button>
  );

  return (
    <form
      className={css.container}
      onSubmit={evt => {
        evt.preventDefault();
        onAddEmail(email);
      }}
    >
      <InputLabel>Add New</InputLabel>
      <Flex gap="x4" direction="vertical">
        <InputContainer>
          <InputContent>
            <Input
              placeholder="E-mail address"
              value={email}
              onChange={(event: any) => onEmailChange(event.target.value)}
              type="email"
              maxLength={emailMaxLength}
              disabled={isAddingEmail}
            />
          </InputContent>
          {isTablet && addEmailButton()}
        </InputContainer>

        {!isTablet && addEmailButton()}
      </Flex>
    </form>
  );
};
