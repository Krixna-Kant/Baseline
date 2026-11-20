import { featurePage } from "@/components/FeaturePage";
import { PreventionPlan } from "@/components/plan/PreventionPlan";

const page = featurePage((d) => d.plan.title, PreventionPlan);
export const generateMetadata = page.generateMetadata;
export default page.Page;
