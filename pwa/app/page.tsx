import dynamic from 'next/dynamic'

const APP = dynamic(() => import('./no-env/page'), {
})


export default function Home() {
  return <APP />
}