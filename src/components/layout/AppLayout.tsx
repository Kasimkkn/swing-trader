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
            <main className='md:pl-[70px] pt-[45px] max-md:pb-[30px]'>
                {children}
            </main>
        </section>
    )
}

export default AppLayout