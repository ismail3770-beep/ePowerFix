// Marketplace tab — redirects to the marketplace index screen
import { Redirect } from 'expo-router';

export default function MarketplaceTab() {
  return <Redirect href={'/marketplace/index' as never} />;
}
