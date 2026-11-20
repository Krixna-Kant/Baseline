import { featurePage } from "@/components/FeaturePage";
import { FamilyCheckIn } from "@/components/family/FamilyCheckIn";

const page = featurePage((d) => d.family.title, FamilyCheckIn);
export const generateMetadata = page.generateMetadata;
export default page.Page;
