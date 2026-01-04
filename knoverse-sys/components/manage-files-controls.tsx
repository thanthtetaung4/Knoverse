"use client"

import React from 'react'
import { useUser } from '@/app/providers/UserProvider'
import FileUploadForm from '@/components/file-upload-form'

export default function ManageFilesControls() {
  const { user } = useUser()

  return (
    <section style={{ marginTop: 24 }}>
      <nav>
        {user ? (
          <p>Welcome, {user.id}. You are an {user.role}</p>
        ) : (
          <p>Not logged in</p>
        )}
      </nav>

      <FileUploadForm />
    </section>
  )
}
