import { useParams } from "react-router-dom";
import PagePlaceholder from "../components/PagePlaceholder";

export default function LeaseLedger() {
  const { id } = useParams();
  return <PagePlaceholder title={`Lease Ledger — ${id}`} />;
}
