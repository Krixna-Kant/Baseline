import { featurePage } from "@/components/FeaturePage";
import { PrivacySettings } from "@/components/privacy/PrivacySettings";

const page = featurePage((d) => d.privacy.title, PrivacySettings);
export const generateMetadata = page.generateMetadata;
export default page.Page;
