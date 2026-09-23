import axios from "axios";
import { baseOcpiURL } from "@/config";

// ADR-003: the vendor self-service OCPI API on the gateway. Authenticated with the operator's own
// login token (the same one AxiosServices sends to the business API), so the gateway resolves the
// vendor from the token and scopes every call to it.
const ocpiApi = axios.create({ baseURL: baseOcpiURL });

ocpiApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// A platform admin (role 1) acts on a chosen vendor; a vendor admin's calls carry no vendorId and the
// gateway uses the token's own vendor. This helper appends ?vendorId only when one is given.
const scoped = (path, vendorId) =>
  vendorId != null && vendorId !== "" ? `${path}?vendorId=${encodeURIComponent(vendorId)}` : path;

const OcpiServices = {
  getParty: (vendorId) => ocpiApi.get(scoped("/portal/ocpi/party", vendorId)),
  saveParty: (body, vendorId) => ocpiApi.put(scoped("/portal/ocpi/party", vendorId), body),
  getConnections: (vendorId) => ocpiApi.get(scoped("/portal/ocpi/connections", vendorId)),
  invitePartner: (partnerLabel, vendorId) =>
    ocpiApi.post(scoped("/portal/ocpi/connections/invite", vendorId), { partnerLabel }),
  // ADR-003 D5: register with a partner/hub that issued us a one-time token.
  registerWithPartner: (body, vendorId) =>
    ocpiApi.post(scoped("/portal/ocpi/connections/register", vendorId), body),
  revokeConnection: (connectionId, vendorId) =>
    ocpiApi.delete(scoped(`/portal/ocpi/connections/${connectionId}`, vendorId)),
};

export default OcpiServices;
