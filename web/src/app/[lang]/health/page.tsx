import { featurePage } from "@/components/FeaturePage";
import { HealthProfile } from "@/components/health/HealthProfile";

const page = featurePage((d) => d.health.title, HealthProfile);
export const generateMetadata = page.generateMetadata;
export default page.Page;
