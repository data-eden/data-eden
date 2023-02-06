import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { client } from '../network/client';
import { parse } from 'graphql';

const UpdatePerson =
  parse(`mutation UpdatePerson($personId: ID!, $input: PersonInput!) {
  updatePerson(personId: $personId, input: $input) {
    id
    name
  }
}
`);

export default class UpdatePersonComponent extends Component {
  @tracked inputValue = '';

  handleInputChange = (e: any) => {
    this.inputValue = e.currentTarget?.value;
  };

  handleSubmit = () => {
    client
      .mutate(UpdatePerson, {
        personId: '1',
        input: { name: this.inputValue },
      })
      .then(() => {
        this.inputValue = '';
      });
  };
}
