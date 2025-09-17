import React from 'react'
import AppNavigations from '../AppNavigations'
import Header from '../Header'

const AppLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <section className='bg-black relative'>
            <Header />
            <aside>
                <AppNavigations />
            </aside>
            <main className='md:pl-24 pl-4 pt-20 max-md:pb-24 pr-4'>
                {children}
            </main>
        </section>
    )
}

export default AppLayout