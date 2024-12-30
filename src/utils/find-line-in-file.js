export default function findLineInFile(packageJsonContent, jsonKey, needle) {
  const lines = packageJsonContent.match(
    new RegExp(`^(.*"${jsonKey}"[^}]*)"${needle}"`, 's'),
  ); // s = dot match new line

  if (!lines) {
    // no lines means that the package has not been found in the file content
    return null;
  }

  // lines[1] does contain every line preceding the wanted package. Let's count the "newline" character
  const newlineMatch = lines[1].match(/\n/gm);

  // if there is not match, we are probably on a single-line JSON file: everything is on the first line
  return newlineMatch ? newlineMatch.length + 1 : 1;
}
