import should from 'should';
import findLineInFile from '../src/utils/find-line-in-file';

describe('find line in file', () => {
  const testCases = [
    {
      name: 'Simplest JSON file',
      packageFile: `{
        "dependencies": {
            "foo": "^1.0.0",
            "bar": "^0.1.0",
        }
    }
`,
      dependencies: { foo: 3, bar: 4, unknown: null },
      devDependencies: { devUnknown: null },
    },

    {
      name: 'JSON with white space at top',
      packageFile: `
          {
              "dependencies": {
                  "foo": "^1.0.0",
                  "bar": "^0.1.0",
              }
          }
      `,
      dependencies: { foo: 4, bar: 5 },
    },

    {
      name: 'One line JSON file',
      packageFile: '{"dependencies":{"foo":"^1.0.0","bar":"^0.1.0"}}',
      dependencies: { foo: 1, bar: 1 },
    },

    {
      name: 'With dependencies and devDependencies',
      packageFile: `{
            "dependencies": {
                "foo": "^1.0.0",
                "bar": "^0.1.0",
            },
            "devDependencies": {
                "fooDev": "^1.0.0",
                "barDev": "^0.1.0",
            }
      }
  `,
      dependencies: { foo: 3, bar: 4, fooDev: null, barDev: null },
      devDependencies: { foo: null, bar: null, fooDev: 7, barDev: 8 },
    },

    {
      name: 'With script before',
      packageFile: `{
        "scripts": {
          "foo": "foo"
        },
        "dependencies": {
          "foo": "^1.0.0",
        }
    }`,
      dependencies: { foo: 6 },
    },

    {
      name: 'With script after',
      packageFile: `{
              "dependencies": {
                  "foo": "^1.0.0",
              },
              "scripts": {
                "foo": "foo"
              }
          }
      `,
      dependencies: { foo: 3 },
    },
  ];

  testCases.forEach((testCase) => {
    ['dependencies', 'devDependencies'].forEach((dependencyKey) => {
      if (!testCase[dependencyKey]) {
        return;
      }

      Object.entries(testCase[dependencyKey]).forEach(
        ([packageName, expectedLine]) => {
          it(`${testCase.name}: ${dependencyKey} "${packageName}"`, () => {
            const actual = findLineInFile(
              testCase.packageFile,
              dependencyKey,
              packageName,
            );

            should(actual).be.exactly(expectedLine);
          });
        },
      );
    });
  });
});
