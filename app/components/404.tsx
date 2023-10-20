import { Link } from '@remix-run/react'

export default function FourOhFour() {
  return (
    <div className='page_404_body'>
      <div className='page_404_div'>
        <aside>
          <img
            src='https://s3-us-west-2.amazonaws.com/s.cdpn.io/4424790/Mirror.png'
            alt='404'
          />
        </aside>
        <main>
          <h1>Sorry!</h1>
          <p>
            Either you aren't cool enough to visit this page or it doesn't exist{' '}
            <em>. . . like your social life.</em>
          </p>
          <Link to='/' prefetch='intent'>
            You can go now!
          </Link>
        </main>
      </div>
    </div>
  )
}
