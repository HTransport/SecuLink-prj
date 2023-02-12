using Microsoft.AspNetCore.Mvc;
using SecuLink.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SecuLink.RequestModels;
using SecuLink.ResponseModels;
using Microsoft.AspNetCore.Cors;
using SecuLink.Tools;

namespace SecuLink.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableCors("local")]
    public class ReaderController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ICardService _cardService;
        private readonly ITokenService _tokenService;
        private readonly IAuthService _authService;
        private readonly ILogService _logService;


        public ReaderController(IUserService userService, ICardService cardService, ITokenService tokenService, IAuthService authService, ILogService logService)
        {
            _userService = userService;
            _cardService = cardService;
            _tokenService = tokenService;
            _authService = authService;
            _logService = logService;
        }

        [HttpPost]
        [Route("logs")]
        public async Task<IActionResult> GetLogs([FromBody] ListForm lf)
        {
            var result = await _authService.Authenticate(lf.Token, _tokenService);
            if (result != 200)
                return StatusCode(result);

            var list = await _logService.GetList();
            List<LogListItem> outList = new();
            if (lf.IsNew)
                CurrentState.ResetLS();
            else CurrentState.LogLS += lf.NumOfElements;

            try
            {
                for (int i = CurrentState.LogLS; i < lf.NumOfElements + CurrentState.LogLS; i++)
                {
                    if (list.ElementAtOrDefault(i) is null)
                        break;
                    outList.Add(list.ElementAtOrDefault(i));
                }
            }
            catch (Exception ex)
            {
                return Problem(ex.ToString());
            }
            return Ok(outList);
        } // 1

        [HttpGet]
        [Route("setup/{MAC}")]
        public async Task<IActionResult> SetupReader(string MAC)
        {
            var r = await _authService.CheckReader(MAC);

            if (r)
                return Ok();
            
            await _authService.AddReader(MAC, true);

            return Ok();
        } // 1

        [HttpPost]
        [Route("remove")]
        public async Task<IActionResult> RemoveReader([FromBody] ReaderForm rf)
        {
            var result = await _authService.Authenticate(rf.Token, _tokenService);
            if (result != 200)
                return StatusCode(result);

            if (!await _authService.CheckReader(rf.MAC))
                return StatusCode(404);

            await _authService.RemoveReader(rf.MAC);

            return Ok();
        } // 1

        [HttpPost]
        [Route("list")]
        public async Task<IActionResult> GetReaders([FromBody] ListForm lf)
        {
            var result = await _authService.Authenticate(lf.Token, _tokenService);
            if (result != 200)
                return StatusCode(result);

            var list = await _authService.GetReaders();
            List<ReaderListItem> outList = new();
            if (lf.IsNew)
                CurrentState.ResetLS();
            else CurrentState.ReaderLS += lf.NumOfElements;

            try
            {
                for (int i = CurrentState.ReaderLS; i < lf.NumOfElements + CurrentState.ReaderLS; i++)
                {
                    if (list.ElementAtOrDefault(i) is null)
                        break;
                    outList.Add(list.ElementAtOrDefault(i));
                }
            }
            catch (Exception ex)
            {
                return Problem(ex.ToString());
            }
            return Ok(outList);
        } // 1

        [HttpPost]
        [Route("edit")]
        public async Task<IActionResult> EditReaders([FromBody] ReaderAppForm rf)
        {
            var result = await _authService.Authenticate(rf.Token, _tokenService);
            if (result != 200)
                return StatusCode(result);

            var u = await _authService.CheckReader(rf.MAC);

            if (!u)
                return StatusCode(404);

            await _authService.EditReader(rf.MAC, rf.Role);

            return Ok();
        } // 1

        [HttpGet]
        [Route("open/{SerialNumber}/{MAC}")]
        public async Task<IActionResult> Open(string SerialNumber, string MAC)
        {
            await _logService.Create(SerialNumber, MAC);

            if (!await _authService.CheckReader(MAC))
                return StatusCode(403, 1);

            var user = await _userService.SelectById((await _cardService.SelectBySerialNumber(SerialNumber)).UserId);
            
            if(user is null)
                return StatusCode(404, 1);

            var Role = user.Role;
            var readerRole = await _authService.GetReaderRole(MAC);

            if (Role || Role == readerRole)
                return Ok(11);

            return StatusCode(403, 1);
        } // 1
    }
}
