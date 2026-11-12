import { createBrowserClient } from "@supabase/ssr"
import { supabaseKey, supabaseUrl } from "./config"

/** Cliente do navegador: usado só para enviar arquivos direto ao Storage. */
export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey)
