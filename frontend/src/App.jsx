import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useNavigation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
// Chef de Service
import ServiceDashboard, { serviceDashboardLoader, ServiceDashboardError } from './pages/ServiceDashboard';
import ServiceMateriels, { serviceMaterielsLoader, ServiceMaterielsError } from './pages/ServiceMateriels';
import ServiceMouvements, { serviceMouvementsLoader, ServiceMouvementsError } from './pages/ServiceMouvements';
import ServiceStock, { serviceStockLoader, ServiceStockError } from './pages/ServiceStock';
import ServiceUsers, { serviceUsersLoader, ServiceUsersError } from './pages/ServiceUsers';
import ServiceRapports, { serviceRapportsLoader, ServiceRapportsError } from './pages/ServiceRapports';
import ServiceParametres, { serviceParametresLoader, ServiceParametresError } from './pages/ServiceParametres';
// Chef de Section
import SectionDashboard, { sectionDashboardLoader, SectionDashboardError } from './pages/SectionDashboard';
import SectionMateriels, { sectionMaterielsLoader, SectionMaterielsError } from './pages/SectionMateriels';
import SectionMouvements, { sectionMouvementsLoader, SectionMouvementsError } from './pages/SectionMouvements';
import SectionStock, { sectionStockLoader, SectionStockError } from './pages/SectionStock';
import SectionUsers, { sectionUsersLoader, SectionUsersError } from './pages/SectionUsers';
import SectionRapports, { sectionRapportsLoader, SectionRapportsError } from './pages/SectionRapports';
import SectionParametres, { sectionParametresLoader, SectionParametresError } from './pages/SectionParametres';
// Chef de Brigade
import BrigadeDashboard, { brigadeDashboardLoader, BrigadeDashboardError } from './pages/BrigadeDashboard';
import BrigadeMateriels, { brigadeMaterielsLoader, BrigadeMaterielsError } from './pages/BrigadeMateriels';
import BrigadeMouvements, { brigadeMouvementsLoader, BrigadeMouvementsError } from './pages/BrigadeMouvements';
import BrigadeStock, { brigadeStockLoader, BrigadeStockError } from './pages/BrigadeStock';
import BrigadeUsers, { brigadeUsersLoader, BrigadeUsersError } from './pages/BrigadeUsers';
import BrigadeRapports, { brigadeRapportsLoader, BrigadeRapportsError } from './pages/BrigadeRapports';
import BrigadeParametres, { brigadeParametresLoader, BrigadeParametresError } from './pages/BrigadeParametres';
// Garde Ligne
import GLDashboard from './pages/GLDashboard';
import GLMateriels from './pages/GLMateriels';
import GLMouvements from './pages/GLMouvements';
import GLProfil from './pages/GLProfil';
import GLRapports from './pages/GLRapports';
import GLParametres from './pages/GLParametres';
// Cantonnier
import CNDashboard from './pages/CNDashboard';
import CNMateriels from './pages/CNMateriels';
import CNMouvements from './pages/CNMouvements';
import CNProfil from './pages/CNProfil';
import CNRapports from './pages/CNRapports';
import CNParametres from './pages/CNParametres';

// Layout racine : englobe toutes les pages et affiche une barre de
// progression en haut de l'écran pendant qu'un loader de route charge
// ses données (navigation.state === 'loading').
function Layout() {
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <>
      <style>{`
        .top-loading-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          width: 100%;
          z-index: 9999;
          background: rgba(37, 99, 235, 0.15);
          overflow: hidden;
        }
        .top-loading-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 40%;
          background: #2563eb;
          border-radius: 2px;
          animation: top-loading-slide 1s ease-in-out infinite;
        }
        @keyframes top-loading-slide {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
      {isLoading && <div className="top-loading-bar" />}
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      // Auth
      { path: '/', element: <Login /> },
      { path: '/register', element: <Register /> },

      // Chef de Service
      {
        path: '/dashboard',
        element: <ServiceDashboard />,
        loader: serviceDashboardLoader,
        errorElement: <ServiceDashboardError />,
      },
      { path: '/materiels', element: <ServiceMateriels />, loader: serviceMaterielsLoader, errorElement: <ServiceMaterielsError /> },
      {
        path: '/mouvements',
        element: <ServiceMouvements />,
        loader: serviceMouvementsLoader,
        errorElement: <ServiceMouvementsError />,
      },
      {
        path: '/stock',
        element: <ServiceStock />,
        loader: serviceStockLoader,
        errorElement: <ServiceStockError />,
      },
      {
        path: '/users',
        element: <ServiceUsers />,
        loader: serviceUsersLoader,
        errorElement: <ServiceUsersError />,
      },
      {
        path: '/rapports',
        element: <ServiceRapports />,
        loader: serviceRapportsLoader,
        errorElement: <ServiceRapportsError />,
      },
      {
        path: '/parametres',
        element: <ServiceParametres />,
        loader: serviceParametresLoader,
        errorElement: <ServiceParametresError />,
      },

      // Chef de Section
      {
        path: '/section/dashboard',
        element: <SectionDashboard />,
        loader: sectionDashboardLoader,
        errorElement: <SectionDashboardError />,
      },
      {
        path: '/section/materiels',
        element: <SectionMateriels />,
        loader: sectionMaterielsLoader,
        errorElement: <SectionMaterielsError />,
      },
      {
        path: '/section/mouvements',
        element: <SectionMouvements />,
        loader: sectionMouvementsLoader,
        errorElement: <SectionMouvementsError />,
      },
      {
        path: '/section/stock',
        element: <SectionStock />,
        loader: sectionStockLoader,
        errorElement: <SectionStockError />,
      },
      {
        path: '/section/users',
        element: <SectionUsers />,
        loader: sectionUsersLoader,
        errorElement: <SectionUsersError />,
      },
      {
        path: '/section/rapports',
        element: <SectionRapports />,
        loader: sectionRapportsLoader,
        errorElement: <SectionRapportsError />,
      },
      {
        path: '/section/parametres',
        element: <SectionParametres />,
        loader: sectionParametresLoader,
        errorElement: <SectionParametresError />,
      },

      // Chef de Brigade
      {
        path: '/brigade/dashboard',
        element: <BrigadeDashboard />,
        loader: brigadeDashboardLoader,
        errorElement: <BrigadeDashboardError />,
      },
      {
        path: '/brigade/materiels',
        element: <BrigadeMateriels />,
        loader: brigadeMaterielsLoader,
        errorElement: <BrigadeMaterielsError />,
      },
      {
        path: '/brigade/mouvements',
        element: <BrigadeMouvements />,
        loader: brigadeMouvementsLoader,
        errorElement: <BrigadeMouvementsError />,
      },
      {
        path: '/brigade/stock',
        element: <BrigadeStock />,
        loader: brigadeStockLoader,
        errorElement: <BrigadeStockError />,
      },
      {
        path: '/brigade/users',
        element: <BrigadeUsers />,
        loader: brigadeUsersLoader,
        errorElement: <BrigadeUsersError />,
      },
      {
        path: '/brigade/rapports',
        element: <BrigadeRapports />,
        loader: brigadeRapportsLoader,
        errorElement: <BrigadeRapportsError />,
      },
      {
        path: '/brigade/parametres',
        element: <BrigadeParametres />,
        loader: brigadeParametresLoader,
        errorElement: <BrigadeParametresError />,
      },

      // Garde Ligne
      { path: '/gl/dashboard', element: <GLDashboard /> },
      { path: '/gl/materiels', element: <GLMateriels /> },
      { path: '/gl/mouvements', element: <GLMouvements /> },
      { path: '/gl/profile', element: <GLProfil /> },
      { path: '/gl/rapports', element: <GLRapports /> },
      { path: '/gl/parametres', element: <GLParametres /> },

      // Cantonnier
      { path: '/cn/dashboard', element: <CNDashboard /> },
      { path: '/cn/materiels', element: <CNMateriels /> },
      { path: '/cn/mouvements', element: <CNMouvements /> },
      { path: '/cn/profile', element: <CNProfil /> },
      { path: '/cn/rapports', element: <CNRapports /> },
      { path: '/cn/parametres', element: <CNParametres /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;