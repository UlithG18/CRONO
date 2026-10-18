namespace Crono.Api.Services;

// Resultado uniforme de las operaciones CRUD del módulo administrativo.
public class CrudResult<T>
{
    public bool Ok { get; set; }
    public string? Error { get; set; }
    public T? Data { get; set; }

    public static CrudResult<T> Success(T data) => new() { Ok = true, Data = data };
    public static CrudResult<T> Fail(string error) => new() { Ok = false, Error = error };
}

// Validaciones comunes de los formularios administrativos.
public static class Validaciones
{
    private static readonly string[] Esquemas = { "http://", "https://" };

    // Fecha en formato yyyy-MM-dd (el formato con el que se persiste y se ordena).
    public static bool EsFecha(string? valor)
        => !string.IsNullOrWhiteSpace(valor)
           && DateTime.TryParseExact(valor!.Trim(), "yyyy-MM-dd", null,
               System.Globalization.DateTimeStyles.None, out _);

    // Un enlace es opcional: si se informa debe ser una URL absoluta válida.
    // Devuelve la URL normalizada (null si se limpia el campo, para no guardar
    // referencias ficticias) y el motivo de rechazo cuando la entrada no es válida.
    public static (string? Url, string? Error) NormalizarEnlace(string? valor)
    {
        var limpio = (valor ?? "").Trim();
        if (limpio.Length == 0) return (null, null);

        if (!Uri.TryCreate(limpio, UriKind.Absolute, out var uri) || !Esquemas.Contains(uri.Scheme))
            return (null, "El enlace debe ser una URL válida (https://...).");

        return (limpio, null);
    }

    // Una cadena se persiste como null cuando está vacía, para no guardar restos.
    public static string? TextoOpcional(string? valor)
    {
        var limpio = (valor ?? "").Trim();
        return limpio.Length == 0 ? null : limpio;
    }

    public static string Texto(string? valor) => (valor ?? "").Trim();
}
