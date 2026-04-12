import { faker } from '@faker-js/faker';

export default () => ({
  faker: {
    count: 5,
    collections: {
      users: () => ({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        age: faker.number.int({ min: 18, max: 65 })
      })
    }
  }
});
