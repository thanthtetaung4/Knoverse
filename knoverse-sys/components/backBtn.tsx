import { useRouter } from "next/navigation"
import { IoChevronBack } from "react-icons/io5";

type BackBtnProps = {
	size?: number;
}

export default function BackBtn({ size }: BackBtnProps) {
	const router = useRouter();

	return (<>

			<IoChevronBack onClick={() => router.replace("/")} className={`cursor-pointer hover:text-gray-500`} size={size ?? 20}/>

	</>)
}
