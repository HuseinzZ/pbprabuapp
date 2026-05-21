import React from 'react';

const Footer = () => {
    return (
        <div className='flex justify-center mt-3 mb-3'>
            <p>© {new Date().getFullYear()} PB Prabu Bandung</p>
        </div>
    );
};

export default Footer;