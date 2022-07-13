import styles from './Header.module.css';

import { useAuth } from '../../utils/auth';
import { getShortPrincipal } from '../../utils/utils';
import { useState } from 'react';

import { AppBar, Button, Container, IconButton, Link, Stack, Toolbar, Typography } from '@mui/material';

import {
	Dialog, DialogContent, DialogTitle, Box, List, ListItem,
	ListItemButton, ListItemText, ListItemAvatar, Avatar
} from '@mui/material';


import Image from 'next/image';

const Header = () => {
	const auth = useAuth()
	const [connected, isConnecting] = useState(false);

	function handleClose() {
		auth.setShowModal(false)
	}

	async function plugLogin() {
		isConnecting(true);
		try {
			await auth.usePlug()
		} catch {

		}
		isConnecting(false);
		auth.setShowModal(false);
	}

	async function infinityLogin() {
		isConnecting(true);
		try {
			await auth.useInfinity()
		} catch {

		}
		isConnecting(false);
		auth.setShowModal(false);
	}

	return (
		<>
			<Dialog open={auth.showModal} onClose={handleClose}>
				<DialogTitle>Select Wallet</DialogTitle>
				<DialogContent>
					<Box>
						<List>
							<ListItem disablePadding>
								<ListItemButton onClick={plugLogin}>
									<ListItemAvatar>
										<Avatar alt="Plug Wallet" src="/images/plug.png" />
									</ListItemAvatar>
									<ListItemText primary="Plug Wallet" />
								</ListItemButton>
							</ListItem>
							<ListItem disablePadding>
								<ListItemButton onClick={infinityLogin}>
									<ListItemAvatar>
										<Avatar alt="Infinity Wallet" src="/images/infinity_wallet.png" />
									</ListItemAvatar>
									<ListItemText primary="Infinity Wallet" />
								</ListItemButton>
							</ListItem>
						</List>
					</Box>
				</DialogContent>
			</Dialog>
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
		</>
	);
};

export default Header;
