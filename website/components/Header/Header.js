import styles from './Header.module.css';

import { useAuth } from '../../utils/auth';
import { getShortPrincipal } from '../../utils/utils';
import { useState } from 'react';

import { AppBar, Button, Container, IconButton, Link, Stack, Toolbar, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Image from 'next/image';

const Header = () => {
	const auth = useAuth()

	const [connected, isConnecting] = useState(false);

	return (
		<AppBar color="appbar" style={{ background: '#121214' }} enableColorOnDark position="static">
			<Container maxWidth="lg">
				<Toolbar>
					<IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
						{/* <MenuIcon /> */}
					</IconButton>
					<Link href="https://gigaversemarket.com/">
						<Image
							src="/images/logo_icon.svg"
							width={240}
							height={40}
							alt=""
						/>
					</Link>
				</Toolbar>
			</Container>
		</AppBar>
	);
};

export default Header;
