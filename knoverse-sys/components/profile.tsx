import { useState } from "react"
import Image from "next/image"
import { IoIosMenu } from "react-icons/io";
import { FaPen } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";

interface FieldData {
	discription: string;
	fieldContent: string;
}

function TextField(field: FieldData) {
	return <div>
		<p className="text-xs mb-1 text-gray-500">{field.discription}</p>
		<p className="border py-3 px-3 w-64 mb-2 rounded-lg bg-gray-50 dark:bg-card">{field.fieldContent}</p>
	</div>
}

export default function ProfileTab() {
	const [trigger, setTrigger] = useState<boolean>(false)
	
	return <div>
		<div className={`border rounded-3xl ${trigger ? "w-80 p-4" : "w-15 px-2 py-4"} h-full flex flex-col items-center`}>
			<Image 
				src="/profile.jpg"
				alt="Profile"
				width={trigger ? 80 : 40}
				height={trigger ? 80 : 40}
				className="rounded-full"
				onClick={() => {setTrigger((prev) => !prev)}}
			/>
			<IoIosMenu size={40} className={ `${trigger ? "hidden" : "block"}` }/>
			{/* <RxCross2 size={40} className={`${trigger ? "hidden" : "block"} mt-2`} onClick={triggerHandle} /> */}
			{trigger &&
				<div className="flex flex-col gap-3">
					{/* <button className="border py-1 px-3 rounded-lg mt-3">Edit Profile</button> */}
					<FaPen size={20} className="absolute left-48 top-32.5 bg-black p-1 rounded-sm" color="white"/>
					<div className="flex flex-col mt-6">
						<TextField discription="Username" fieldContent="Lawrence" />
						<TextField discription="Role" fieldContent="Member"/>
					</div>
					<button className="border py-1 px-3 rounded-lg">Update Password</button>
				</div>
			}
		</div>
	</div>
}
