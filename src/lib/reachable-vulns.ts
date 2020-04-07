import {
  REACHABLE_VULNS_SUPPORTED_PACKAGE_MANAGERS,
  SupportedPackageManagers,
} from './package-managers';
import { FeatureNotSupportedByPackageManagerError } from './errors';

export function checkCallGraph(callGraph, packageManager: SupportedPackageManagers) {
  if (!REACHABLE_VULNS_SUPPORTED_PACKAGE_MANAGERS.includes(packageManager)) {
    throw new FeatureNotSupportedByPackageManagerError(
      '--reachable-vulns',
      packageManager,
    );
  }
  return callGraph;
}
