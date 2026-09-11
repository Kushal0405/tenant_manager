import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function PagePlaceholder({ title }: { title: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 4,
        borderColor: "#EDE9FE",
        p: 4,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F3EEFF",
          color: "primary.main",
        }}
      >
        <ConstructionRoundedIcon />
      </Box>
      <Typography variant="h4" sx={{ fontSize: 20 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ fontSize: 13.5, maxWidth: 320 }}>
        This page will be built once the schema proposal is approved.
      </Typography>
    </Paper>
  );
}
