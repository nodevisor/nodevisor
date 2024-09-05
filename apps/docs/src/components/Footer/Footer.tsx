import Link from 'next/link';

export default function Footer() {
  return (
    <div className="mx-auto px-4 max-w-8xl pb-4">
      {new Date().getFullYear()} ©{' '}
      <Link href="https://www.nodevisor.com" target="_blank">
        Nodevisor
      </Link>
    </div>
  );
}
