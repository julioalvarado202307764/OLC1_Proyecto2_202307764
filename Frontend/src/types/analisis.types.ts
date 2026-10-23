/* =========================================================
   SOLICITUD A /api/analyze Y /api/execute
   ========================================================= */

export interface SolicitudAnalisis {
    codigo: string;
}


/* =========================================================
   TOKENS DEL ANALIZADOR
   ========================================================= */

export interface TokenAnalisis {
    lexema: string;
    tipo: string;
    linea: number;
    columna: number;
    valorProcesado?: string;
}


/* =========================================================
   ERRORES DEL ANALIZADOR
   ========================================================= */

export interface ErrorLexico {
    tipo: "Léxico";
    descripcion: string;
    lexema: string;
    linea: number;
    columna: number;
}


export interface ErrorSintactico {
    tipo: "Sintáctico";
    descripcion: string;
    lexema: string;
    linea: number;
    columna: number;
}


/* =========================================================
   AST

   El Frontend no reproduce los nodos internos del compilador.
   Solo reconoce que recibe un AST serializable cuyo nodo raíz
   posee la propiedad "type".
   ========================================================= */

export interface NodoASTSerializable {
    type: string;
    [clave: string]: unknown;
}


/* =========================================================
   REPORTE DE TOKENS
   ========================================================= */

export interface FilaReporteToken {
    numero: number;
    lexema: string;
    token: string;
    linea: number;
    columna: number;
}


export interface ReporteTokens {
    filas: FilaReporteToken[];
}


/* =========================================================
   REPORTE DE ERRORES
   ========================================================= */

export type TipoErrorReporte =
    | "Léxico"
    | "Sintáctico"
    | "Ejecución"
    | "Infraestructura";


export interface FilaReporteError {
    numero: number;
    tipo: TipoErrorReporte;
    codigo: string | null;
    descripcion: string;
    linea: number;
    columna: number;
}


export interface ReporteErrores {
    filas: FilaReporteError[];
}


/* =========================================================
   REPORTE DEL AST
   ========================================================= */

export interface NodoReporteAST {
    id: string;
    etiqueta: string;
}


export interface AristaReporteAST {
    origen: string;
    destino: string;
}


export interface ReporteAST {
    nodos: NodoReporteAST[];
    aristas: AristaReporteAST[];
    dot: string | null;
    svg: string | null;
}


/* =========================================================
   REPORTES
   ========================================================= */

export interface FilaReporteSimbolo {
    numero: number;
    identificador: string;
    categoria: string;
    tipo: string;
    ambito: string;
    valor: string;
    linea: number;
    columna: number;
}

export interface ReporteSimbolos {
    filas: FilaReporteSimbolo[];
}

export interface FilaEstadoFinal {
    recurso: string;
    tipo: string;
    estado: string;
    detalles: string;
}

export interface ReporteEstadoFinal {
    filas: FilaEstadoFinal[];
}

export interface FilaBitacora {
    numero: number;
    nivel: "OK" | "FAIL" | "ERROR";
    mensaje: string;
    linea: number | null;
    columna: number | null;
}

export interface ReporteBitacora {
    filas: FilaBitacora[];
}

export interface ResultadoReportes {
    tablaTokens: ReporteTokens;
    errores: ReporteErrores;
    ast: ReporteAST;

    /* Solo cuando el programa fue ejecutado. */
    tablaSimbolos?: ReporteSimbolos;
    estadoFinal?: ReporteEstadoFinal;
    bitacora?: ReporteBitacora;
}


/* =========================================================
   EJECUCIÓN
   ========================================================= */

export interface ResumenEjecucion {
    exito: boolean;
    abortada: boolean;
    consola: string[];
    salida: string[];
}


/* =========================================================
   RESPUESTA EXITOSA DE /api/analyze Y /api/execute
   ========================================================= */

export interface RespuestaAnalisis {
    ast: NodoASTSerializable | null;

    tokens: TokenAnalisis[];

    erroresLexicos: ErrorLexico[];

    erroresSintacticos: ErrorSintactico[];

    reportes: ResultadoReportes;

    ejecutado: boolean;

    ejecucion: ResumenEjecucion | null;

    mensajeEjecucion: string | null;
}


/* =========================================================
   RESPUESTAS HTTP DE ERROR

   El Backend actual utiliza esta estructura para 400 / 500.
   ========================================================= */

export interface RespuestaErrorAPI {
    error: string;
}