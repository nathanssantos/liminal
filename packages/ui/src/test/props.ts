import * as ts from 'typescript'

export function declaredPropNames(text: string, typeName: string): string[] {
  const source = ts.createSourceFile(
    `${typeName}.tsx`,
    text,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TSX,
  )
  const names: string[] = []
  let found = false
  for (const statement of source.statements) {
    const members = membersOf(statement, typeName)
    if (!members) continue
    found = true
    for (const member of members) {
      if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
        names.push(member.name.text)
      }
    }
  }
  if (!found) throw new Error(`no type named ${typeName} is declared`)
  return names
}

function membersOf(
  statement: ts.Statement,
  typeName: string,
): readonly ts.TypeElement[] | undefined {
  if (ts.isInterfaceDeclaration(statement) && statement.name.text === typeName) {
    return statement.members
  }
  if (
    ts.isTypeAliasDeclaration(statement) &&
    statement.name.text === typeName &&
    ts.isTypeLiteralNode(statement.type)
  ) {
    return statement.type.members
  }
  return undefined
}
