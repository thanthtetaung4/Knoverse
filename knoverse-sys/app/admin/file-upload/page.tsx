'use client'

import { useUser } from '@/app/providers/UserProvider'
import FileUploadForm  from '@/components/file-upload-form'

export default function Navbar() {
  const { user } = useUser()


  return (
    <>
    <nav>
      {user ? (
        <p>Welcome, {user.email}. You are an {user.role}</p>
      ) : (
        <p>Not logged in</p>
      )}
    </nav>
    <FileUploadForm />

    </>
  )
}
