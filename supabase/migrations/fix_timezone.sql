-- Recriar a view leitura_do_dia com fuso horário correto (America/Sao_Paulo)
DROP VIEW IF EXISTS leitura_do_dia;

CREATE VIEW leitura_do_dia AS
SELECT 
  l.*,
  e.conteudo AS explicacao
FROM leituras l
LEFT JOIN explicacoes e ON e.leitura_id = l.id
WHERE l.data_leitura = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date;
