import Typography from "@mui/material/Typography";

export default function PagePlaceholder({ title }: { title: string }) {
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary">
        This page will be built once the schema proposal is approved.
      </Typography>
    </div>
  );
}
