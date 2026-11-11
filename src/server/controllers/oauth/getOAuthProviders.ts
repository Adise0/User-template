import { Request, Response } from "express";
import { getConfiguredOAuthProviders } from "../../utils/oauth/providers";

// Which "Sign in with..." buttons the frontend should show.
const getOAuthProviders = (_req: Request, res: Response) => {
  res.json({
    providers: getConfiguredOAuthProviders().map(({ name, supportsPkce }) => ({
      name,
      supportsPkce,
    })),
  });
};

export default getOAuthProviders;
