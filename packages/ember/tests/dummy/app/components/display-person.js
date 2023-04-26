import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { client } from '../network/client';
import { parse } from 'graphql';

const PersonQuery = parse(`query Person($id: ID!) {
  person(id: $id) {
    id
    name
    car {
      id
      make
      model
    }
    pets {
      id
      name
      owner {
        id
        name
      }
    }
  }
}
`);

export default class DisplayPersonComponent extends Component {
  @tracked loading = false;
  @tracked person = null;

  constructor(owner, args) {
    super(owner, args);
    this.doFetch();
  }

  doFetch() {
    console.log('do fetch');
    this.loading = true;
    client
      .query(PersonQuery, { id: '1' })
      .then((res) => {
        console.log('res', res);
        this.person = res.person;
      })
      .finally(() => (this.loading = false));
  }
}
