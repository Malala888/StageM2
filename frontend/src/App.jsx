import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
// Chef de Service
import ServiceDashboard from './pages/ServiceDashboard';
import ServiceMateriels from './pages/ServiceMateriels';
import ServiceMouvements from './pages/ServiceMouvements';
import ServiceStock from './pages/ServiceStock';
import ServiceUsers from './pages/ServiceUsers';
import ServiceRapports from './pages/ServiceRapports';
import ServiceParametres from './pages/ServiceParametres';
// Chef de Section
import SectionDashboard from './pages/SectionDashboard';
import SectionMateriels from './pages/SectionMateriels';
import SectionMouvements from './pages/SectionMouvements';
import SectionStock from './pages/SectionStock';
import SectionUsers from './pages/SectionUsers';
import SectionRapports from './pages/SectionRapports';
import SectionParametres from './pages/SectionParametres';
// Chef de Brigade
import BrigadeDashboard from './pages/BrigadeDashboard';
import BrigadeMateriels from './pages/BrigadeMateriels';
import BrigadeMouvements from './pages/BrigadeMouvements';
import BrigadeStock from './pages/BrigadeStock';
import BrigadeUsers from './pages/BrigadeUsers';
import BrigadeRapports from './pages/BrigadeRapports';
import BrigadeParametres from './pages/BrigadeParametres';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Chef de Service */}
        <Route path="/dashboard" element={<ServiceDashboard />} />
        <Route path="/materiels" element={<ServiceMateriels />} />
        <Route path="/mouvements" element={<ServiceMouvements />} />
        <Route path="/stock" element={<ServiceStock />} />
        <Route path="/users" element={<ServiceUsers />} />
        <Route path="/rapports" element={<ServiceRapports />} />
        <Route path="/parametres" element={<ServiceParametres />} />

        {/* Chef de Section */}
        <Route path="/section/dashboard" element={<SectionDashboard />} />
        <Route path="/section/materiels" element={<SectionMateriels />} />
        <Route path="/section/mouvements" element={<SectionMouvements />} />
        <Route path="/section/stock" element={<SectionStock />} />
        <Route path="/section/users" element={<SectionUsers />} />
        <Route path="/section/rapports" element={<SectionRapports />} />
        <Route path="/section/parametres" element={<SectionParametres />} />

        {/* Chef de Brigade */}
        <Route path="/brigade/dashboard" element={<BrigadeDashboard />} />
        <Route path="/brigade/materiels" element={<BrigadeMateriels />} />
        <Route path="/brigade/mouvements" element={<BrigadeMouvements />} />
        <Route path="/brigade/stock" element={<BrigadeStock />} />
        <Route path="/brigade/users" element={<BrigadeUsers />} />
        <Route path="/brigade/rapports" element={<BrigadeRapports />} />
        <Route path="/brigade/parametres" element={<BrigadeParametres />} />

        {/* Garde Ligne */}
        <Route path="/gl/dashboard" element={<GLDashboard />} />
        <Route path="/gl/materiels" element={<GLMateriels />} />
        <Route path="/gl/mouvements" element={<GLMouvements />} />
        <Route path="/gl/profile" element={<GLProfil />} />
        <Route path="/gl/rapports" element={<GLRapports />} />
        <Route path="/gl/parametres" element={<GLParametres />} />

        {/* Cantonnier */}
        <Route path="/cn/dashboard" element={<CNDashboard />} />
        <Route path="/cn/materiels" element={<CNMateriels />} />
        <Route path="/cn/mouvements" element={<CNMouvements />} />
        <Route path="/cn/profile" element={<CNProfil />} />
        <Route path="/cn/rapports" element={<CNRapports />} />
        <Route path="/cn/parametres" element={<CNParametres />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;