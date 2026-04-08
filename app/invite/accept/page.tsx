import { Suspense } from 'react'
import AcceptInviteClient from './AcceptInviteClient'

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0D0D0D' }}>
        <div style={{ width:28, height:28, border:'2.5px solid #FFCB1A', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      </div>
    }>
      <AcceptInviteClient />
    </Suspense>
  )
}
