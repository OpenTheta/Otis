import {useRouter} from "next/router";
import Navbar from "@/components/navbar";
import styles from "@/styles/Home.module.css";
import {useEffect, useState} from "react";
import Image from "next/image";
import Footer from "@/components/footer";

export default function Home() {

    const router = useRouter();

    const handleClick = (route: string) => {
        // Navigate to the about page
        router.push('/'+route);
    };

    const [imageSrc, setImageSrc] = useState('/oties/1.png');

    useEffect(() => {
        let current = 1;
        const interval = setInterval(() => {
            // let current = Number(imageSrc.slice(7, 8))
            if(current<7) {
                current++;
            } else {
                current = 1;
            }
            // Update the image source here
            setImageSrc(`/oties/${current}.png`);
        }, 2000);

        return () => clearInterval(interval);
    }, []);


    return (
        <>
            <Navbar/>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <Image src="/otiesLogo.png" alt="Logo" layout="responsive" width={750} height={300}/>
                    <h3 style={{color: 'white', marginLeft: '1em'}}>Use your Otie to cast your votie</h3>
                    <div>
                        <button className={styles.voteButton} onClick={() => handleClick('nft')}>CAST VOTE</button>
                    </div>
                </div>
                <div className={styles.dynamicImage}>
                    <Image src={imageSrc} alt="Dynamic" layout="responsive" width={500} height={500}/>
                </div>
            </div>
            <Footer/>
        </>
    );
}
