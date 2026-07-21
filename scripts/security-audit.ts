// Temporary, exact security-audit exceptions for Expo SDK 51 transitive tooling.
// Unknown advisories still fail. This allowlist expires automatically so the
// project cannot silently carry these exceptions indefinitely.

const expiresAt = new Date('2026-10-01T00:00:00Z')

const exceptions = [
  // tar 6.2.1 via expo -> @expo/cli. Patched tar 7.x is outside the SDK 51 range.
  'GHSA-34x7-hfp2-rc4v',
  'GHSA-8qq5-rm4j-mr97',
  'GHSA-83g3-92jg-28cx',
  'GHSA-qffp-2rhf-9h96',
  'GHSA-9ppj-qmqm-q256',
  'GHSA-r6q2-hw4h-h46w',
  // turbo-stream 2.4.1 via expo-router -> @remix-run/server-runtime.
  'GHSA-rxv8-25v2-qmq8',
  // @xmldom/xmldom 0.7.13 via expo -> @expo/plist. Patched 0.8.x is outside
  // the SDK 51 dependency range.
  'GHSA-wh4c-j3r5-mjhp',
  'GHSA-2v35-w6hq-6mfw',
  'GHSA-f6ww-3ggp-fr8h',
  'GHSA-x6wf-f3px-wcqx',
  'GHSA-j759-j44w-7fr8',
] as const

if (Date.now() >= expiresAt.getTime()) {
  console.error(
    `[security-audit] Expo SDK 51 advisory exceptions expired on ${expiresAt.toISOString()}. ` +
      'Upgrade Expo and remove the allowlist before renewing this gate.'
  )
  process.exit(1)
}

console.warn(
  `[security-audit] Applying ${exceptions.length} exact Expo SDK 51 exceptions until ${expiresAt
    .toISOString()
    .slice(0, 10)}. New high-severity advisories remain blocking.`
)

const args = [
  'audit',
  '--audit-level=high',
  ...exceptions.flatMap((advisory) => ['--ignore', advisory]),
]
const result = Bun.spawnSync({
  cmd: ['bun', ...args],
  cwd: process.cwd(),
  env: process.env,
  stdout: 'inherit',
  stderr: 'inherit',
})

process.exit(result.exitCode)
