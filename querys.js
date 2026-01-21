wrapper = require('./wrapper-module');

async function listarQuimicos(dtIni, dtFin) {
    try {
        await wrapper.createDefaultPool(); // Would normally be done at process start

        let rows = await wrapper.executeResultSet(
            `SELECT 
        	TO_CHAR(DTNEG, 'YYYY-MM-DD') || ' ' || (substr(LPAD(NVL(HRMOV,0), 6, 0), 1, 2) || ':' ||  substr(LPAD(NVL(HRMOV,0), 6, 0), 3, 2) || ':' ||  substr(LPAD(NVL(HRMOV,0), 6, 0), 5, 2))  A_DATE, 
        	REPLACE(FAZ.NOMEPARC, 'FAZENDA ', '') AS B_Fazenda,
            PRJ.CODPROJ C_TALHAO,
            '' D_CULTURA, '' E_VARIEDADE, 
            NVL(REQ.CODPROD, CASE WHEN REQ.MODELO = 'FE' THEN 39 WHEN REQ.MODELO = 'PU' THEN 26 WHEN REQ.MODELO = 'AD' THEN 10 ELSE 0 END) F_IDATIVIDADE,
            CAB.OBSERVACAO G_NOTAS, '' H_GRUPOQUIMICO, ITE.CODPROD I_IDPRODUTO, '' J_ESPACOBRANCO,  ITE.QTDNEG K_QTDTOTAL,
            (ITE.QTDNEG / NVL(PRJ.AD_AREAPLANTIO,1)) L_DOSEHA, '' M_ESPACOBRANCO, '' N_ESPACOBRANCO, ITE.NUNOTA erp_record_code
            FROM TGFITE ITE
            JOIN TGFCAB CAB ON CAB.NUNOTA = ITE.NUNOTA
            JOIN TGFPRO PRO ON PRO.CODPROD = ITE.CODPROD
            JOIN TCSPRJ PRJ ON PRJ.CODPROJ = CAB.CODPROJ AND PRJ.ANALITICO = 'S'
            LEFT JOIN TGFPAR FAZ ON FAZ.CODPARC = PRJ.AD_CODFAZ 
            LEFT JOIN TGFPRO CUL ON CUL.CODPROD = PRJ.CODPROD
            LEFT JOIN AD_DBAGRFINALIDADE FIN ON FIN.CODFINALIDADE = PRO.AD_CODFINALIDADE
            LEFT JOIN AD_DBAGRCLASSE CLA ON CLA.CODCLASSE = PRO.AD_CODCLASSE
            LEFT JOIN AD_DBAGRREQINS REQ ON REQ.NUNOTA = CAB.NUNOTA 
            WHERE CAB.STATUSNOTA  = 'L'
            AND (PRJ.CODPROJ BETWEEN 100000000 AND 199999999)
            AND (TRUNC(CAB.DTNEG) BETWEEN TO_DATE('${dtIni}', 'DD/MM/YYYY') AND TO_DATE('${dtFin}', 'DD/MM/YYYY'))
            ORDER BY CAB.DTNEG`, {},
            {
                resultSet: true
            }
        );

        rows = rows.map((row) => {
            if(Number(row['I_IDPRODUTO']) == 10837 || Number(row['I_IDPRODUTO']) == 19352){
                row['I_IDPRODUTO'] = 18953
            } else if (Number(row['I_IDPRODUTO']) == 1040 || Number(row['I_IDPRODUTO']) == 1041
            || Number(row['I_IDPRODUTO']) == 1042 || Number(row['I_IDPRODUTO']) == 1043) {
                row['I_IDPRODUTO'] = 19355
            }
            return row;
        });

        console.log('Retornados ' + rows.length + ' registros de insumos.');
        return rows;
    } catch (err) {
        console.log('Ops ', err);
    }
}


async function listarProducao(dtIni, dtFin) {
    try {
        await wrapper.createDefaultPool(); // Would normally be done at process start

        const rows = await wrapper.executeResultSet(
            `SELECT 
            TO_CHAR(DTNEG, 'YYYY-MM-DD') || ' ' || (substr(LPAD(NVL(HRMOV,0), 6, 0), 1, 2) || ':' ||  substr(LPAD(NVL(HRMOV,0), 6, 0), 3, 2) || ':' ||  substr(LPAD(NVL(HRMOV,0), 6, 0), 5, 2))  A_DATE,
            REPLACE(TRANSLATE(FAZ.NOMEPARC,
                  'ŠŽšžŸÁÇÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕËÜÏÖÑÝåáçéíóúàèìòùâêîôûãõëüïöñýÿ',
                  'SZszYACEIOUAEIOUAEIOUAOEUIONYaaceiouaeiouaeiouaoeuionyy'), 'FAZENDA ', '') AS B_Fazenda,
            PRJ.CODPROJ C_TALHAO,
            '' AS D_CULTURA,
            CASE WHEN ITE.CODPROD IN (3880,14061) THEN 'ML214IG1I' WHEN ITE.CODPROD IN (3881,12419,14060) THEN 'ML214IG2I' ELSE 'ML214IGLI' END E_MEDICAO,
            (SELECT OBSERVACAO FROM TGFCAB CAB WHERE CAB.NUNOTA = ITE.NUNOTA AND ROWNUM = 1) F_NOTAS,
            QTDENTRADA ritems,
            ITE.NUNOTA erp_record_code	
            FROM VAD_ITENSRASTREABILIDADE ITE
            JOIN TGFPRO PRO ON PRO.CODPROD = ITE.CODPROD 
            JOIN TCSPRJ PRJ ON PRJ.CODPROJ = ITE.CODPROJ AND PRJ.ANALITICO = 'S'
            LEFT JOIN TGFPAR FAZ ON FAZ.CODPARC = PRJ.AD_CODFAZ 
            LEFT JOIN TGFPRO CUL ON CUL.CODPROD = PRJ.CODPROD
            WHERE CODTIPOPER = 782
            AND TRUNC(DTNEG) BETWEEN TO_DATE('${dtIni}', 'DD/MM/YYYY') AND TO_DATE('${dtFin}', 'DD/MM/YYYY')`,
            {},
            {
                resultSet: true
            }
        );

        console.log('Retornados ' + rows.length + ' registros de composicoes.');
        return rows;
    } catch (err) {
        console.log('Ops ', err);
    }
}

module.exports = {
    listarProducao,
    listarQuimicos,
}
