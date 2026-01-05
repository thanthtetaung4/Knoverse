import HeaderCard from "@/components/dashboard-header-card";
import SettingsPageCard from "@/components/setting-card";

export default function SettingsPage() {
	  return (
		<>
			<HeaderCard title="Settings" description="Admin settings page" />
			<SettingsPageCard />
		</>
	);
}
