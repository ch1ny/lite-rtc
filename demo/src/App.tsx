import { LaptopOutlined } from '@ant-design/icons';
import { App, Breadcrumb, Layout, Menu, theme, type MenuProps } from 'antd';
import { lazy, Suspense } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import styles from './App.module.less';

const Pages = {
	BaseUsage: lazy(() => import('./pages/BaseUsage')),
};

const { Header, Content, Sider } = Layout;

const items1: MenuProps['items'] = ['1', '2', '3'].map((key) => ({
	key,
	label: `nav ${key}`,
}));

const items2: MenuProps['items'] = [
	{
		key: 'Usage',
		icon: <LaptopOutlined />,
		label: 'Usage',
		children: Object.keys(Pages).map((key) => {
			return {
				key,
				label: key,
			};
		}),
	},
];

export default function () {
	const {
		token: { colorBgContainer },
	} = theme.useToken();

	const navTo = useNavigate();

	return (
		<App className={styles.app}>
			<Layout className={styles.layout}>
				<Header className='header'>
					<div className='logo' />
					<Menu theme='dark' mode='horizontal' defaultSelectedKeys={['2']} items={items1} />
				</Header>
				<Layout>
					<Sider width={200} style={{ background: colorBgContainer }}>
						<Menu
							mode='inline'
							defaultSelectedKeys={['1']}
							defaultOpenKeys={['sub1']}
							style={{ height: '100%', borderRight: 0 }}
							items={items2}
							onSelect={({ selectedKeys }) => {
								navTo(selectedKeys[0]);
							}}
						/>
					</Sider>
					<Layout style={{ padding: '0 24px 24px' }}>
						<Breadcrumb
							style={{ margin: '16px 0' }}
							items={[
								{
									title: 'Home',
								},
								{
									title: 'List',
								},
								{
									title: 'App',
								},
							]}
						/>
						<Content
							style={{
								padding: 24,
								margin: 0,
								minHeight: 280,
								background: colorBgContainer,
							}}
						>
							<Suspense fallback={null}>
								<Routes>
									<Route path='/BaseUsage' element={<Pages.BaseUsage />} />
								</Routes>
							</Suspense>
						</Content>
					</Layout>
				</Layout>
			</Layout>
		</App>
	);
}
