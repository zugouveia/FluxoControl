using Microsoft.EntityFrameworkCore;
using RendaControl.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Em produção (Railway) a connection string vem pela env var DATABASE_URL.
// Localmente, cai para o appsettings.json (ConnectionStrings:DefaultConnection).
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string connectionString;

if (databaseUrl != null && databaseUrl.StartsWith("postgresql://"))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]}";
}
else
{
    connectionString = databaseUrl ?? builder.Configuration.GetConnectionString("DefaultConnection")!;
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddCors();
builder.Services.AddControllers();

// Mantém o comportamento antigo do Npgsql para DateTime sem timezone (usado em Servico.DataInicio/DataFim).
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var app = builder.Build();

app.UseCors(policy => policy
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
