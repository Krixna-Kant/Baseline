import { featurePage } from "@/components/FeaturePage";
import { InformantForm } from "@/components/family/InformantForm";

const page = featurePage((d) => d.family.formTitle, InformantForm);
export const generateMetadata = page.generateMetadata;
export default page.Page;
