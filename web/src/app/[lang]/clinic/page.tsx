import { featurePage } from "@/components/FeaturePage";
import { ClinicConsole } from "@/components/clinic/ClinicConsole";

const page = featurePage((d) => d.clinic.title, ClinicConsole, "wide");
export const generateMetadata = page.generateMetadata;
export default page.Page;
